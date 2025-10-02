import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import DatabaseHelper from '../Screens/DatabaseHelper'; // Assuming DatabaseHelper is in this path

// --- Main FriendsScreen Component ---
const FriendsScreen = ({ route }) => {
  const { mobile } = route.params; 

  // --- State Management ---
  const [selectedSection, setSelectedSection] = useState(null);
  const [showReports, setShowReports] = useState(false); // New state for reports
  const [friends, setFriends] = useState([{ id: Date.now(), name: '' }]);
  const [events, setEvents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [goals, setGoals] = useState([{ id: Date.now(), item: '', done: false }]);
  const [memories, setMemories] = useState([{ id: Date.now(), image: null, note: '' }]);
  const [modalVisible, setModalVisible] = useState(false);

  // --- Data Persistence ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const friendsData = await DatabaseHelper.getUserData(mobile, 'friends_list');
        if (friendsData && friendsData.length > 0) setFriends(friendsData);

        const eventsData = await DatabaseHelper.getUserData(mobile, 'friends_events');
        if (eventsData) setEvents(eventsData);
        
        const tripsData = await DatabaseHelper.getUserData(mobile, 'friends_trips');
        if (tripsData) setTrips(tripsData);

        const goalsData = await DatabaseHelper.getUserData(mobile, 'friends_goals');
        if (goalsData && goalsData.length > 0) setGoals(goalsData);

        const memoriesData = await DatabaseHelper.getUserData(mobile, 'friends_memories');
        if (memoriesData && memoriesData.length > 0) setMemories(memoriesData);

      } catch (error) {
        console.error("Failed to load friends data:", error);
      }
    };
    loadData();
  }, [mobile]);

  useEffect(() => {
    const saveData = async () => {
      try {
        await DatabaseHelper.saveUserData(mobile, 'friends_list', friends);
        await DatabaseHelper.saveUserData(mobile, 'friends_events', events);
        await DatabaseHelper.saveUserData(mobile, 'friends_trips', trips);
        await DatabaseHelper.saveUserData(mobile, 'friends_goals', goals);
        await DatabaseHelper.saveUserData(mobile, 'friends_memories', memories);
      } catch (error) {
        console.error("Failed to save friends data:", error);
      }
    };
    saveData();
  }, [friends, events, trips, goals, memories, mobile]);

  // --- Handlers ---
  const handleAddFriend = () => setFriends([...friends, { id: Date.now(), name: '' }]);
  const handleRemoveFriend = (id) => setFriends(friends.filter(f => f.id !== id));
  const handleFriendNameChange = (id, name) => {
    setFriends(friends.map(f => f.id === id ? { ...f, name } : f));
  };
  
  const createNewPlan = (type) => {
    const newPlan = { id: Date.now(), name: '', amount: '', roles: '', date: new Date().toISOString() };
    if (type === 'events') setEvents([newPlan, ...events]);
    if (type === 'trips') setTrips([newPlan, ...trips]);
  };
  
  const updatePlan = (type, id, field, value) => {
    const updater = (plans) => plans.map(p => p.id === id ? { ...p, [field]: value } : p);
    if (type === 'events') setEvents(updater);
    if (type === 'trips') setTrips(updater);
  };

  const removePlan = (type, id) => {
    if (type === 'events') setEvents(events.filter(p => p.id !== id));
    if (type === 'trips') setTrips(trips.filter(p => p.id !== id));
  };
  
  const handleAddRow = (section) => {
    if (section === 'goals') setGoals([...goals, { id: Date.now(), item: '', done: false }]);
    if (section === 'memories') setMemories([...memories, { id: Date.now(), image: null, note: '' }]);
  };

  const handleRemoveRow = (section, id) => {
    if (section === 'goals') setGoals(goals.filter(g => g.id !== id));
    if (section === 'memories') setMemories(memories.filter(m => m.id !== id));
  };

  const handleInputChange = (section, id, value) => {
    if (section === 'goals') setGoals(goals.map(g => g.id === id ? { ...g, item: value } : g));
    if (section === 'memories') setMemories(memories.map(m => m.id === id ? { ...m, note: value } : m));
  };

  const toggleGoalDone = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const handleImagePick = (id) => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.error) { Alert.alert("Error", "ImagePicker Error: " + response.error); return; }
      if (response.assets && response.assets.length > 0) {
        setMemories(memories.map(m => m.id === id ? { ...m, image: response.assets[0].uri } : m));
      }
    });
  };

  // --- Render Functions ---

  const renderFriendsModal = () => (
    <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.sectionHeader}>Manage Friends</Text>
          <ScrollView>
            {friends.map((friend) => (
              <View key={friend.id} style={styles.rowContainer}>
                <TextInput style={styles.largeInput} placeholder="Friend's Name" value={friend.name} onChangeText={(text) => handleFriendNameChange(friend.id, text)} />
                <TouchableOpacity onPress={() => handleRemoveFriend(friend.id)}>
                  <Ionicons name="remove-circle-outline" size={28} color="#A52A2A" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
              <Ionicons name="add-circle" size={30} color="#5A2E18" />
              <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCloseButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPlans = (type, data) => {
    const title = type === 'events' ? "Events / Parties" : "Trips / Travel";
    const validFriends = friends.filter(f => f.name.trim() !== '');

    return (
      <View style={styles.fullScreenSectionContainer}>
        <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={30} color="#5A2E18" />
        </TouchableOpacity>
        <Text style={styles.sectionHeader}>{title}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => createNewPlan(type)}>
          <Text style={styles.addButtonText}>Plan New {type === 'events' ? 'Event' : 'Trip'}</Text>
        </TouchableOpacity>
        <ScrollView>
          {data.map(plan => {
            const amount = parseFloat(plan.amount) || 0;
            const perHead = validFriends.length > 0 ? (amount / validFriends.length).toFixed(2) : 0;
            return (
              <View key={plan.id} style={styles.planContainer}>
                <TextInput style={styles.planTitleInput} placeholder={type === 'events' ? 'Event Name' : 'Trip Name'} value={plan.name} onChangeText={val => updatePlan(type, plan.id, 'name', val)} />
                <TextInput style={styles.planAmountInput} placeholder="Estimated Total Amount" keyboardType="numeric" value={String(plan.amount)} onChangeText={val => updatePlan(type, plan.id, 'amount', val)} />
                <Text style={styles.perHeadText}>Per Head: ${perHead} (for {validFriends.length} friends)</Text>
                <Text style={styles.rolesHeader}>Roles & Responsibilities</Text>
                <TextInput style={styles.rolesInput} placeholder="e.g., DJ: Mike, Food: Sarah" multiline value={plan.roles} onChangeText={val => updatePlan(type, plan.id, 'roles', val)} />
                <TouchableOpacity style={styles.removePlanButton} onPress={() => removePlan(type, plan.id)}>
                  <Text style={styles.removePlanText}>Remove Plan</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };
  
  const renderMemories = () => (
     <View style={styles.fullScreenSectionContainer}>
        <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={30} color="#5A2E18" />
        </TouchableOpacity>
        <Text style={styles.sectionHeader}>Memories</Text>
        <ScrollView>
          {memories.map((memory) => (
            <View key={memory.id} style={styles.memoryRowContainer}>
              <TouchableOpacity style={styles.imagePickerContainer} onPress={() => handleImagePick(memory.id)}>
                {memory.image ? (
                  <Image source={{ uri: memory.image }} style={styles.memoryImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color="#5A2E18" />
                    <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TextInput style={styles.memoryNoteInput} placeholder="Memory note..." value={memory.note} onChangeText={(val) => handleInputChange('memories', memory.id, val)} multiline />
              <TouchableOpacity onPress={() => handleRemoveRow('memories', memory.id)}>
                <Ionicons name="remove-circle-outline" size={28} color="#A52A2A" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('memories')}>
            <Ionicons name="add-circle" size={30} color="#5A2E18" />
            <Text style={styles.addButtonText}>Add Memory</Text>
          </TouchableOpacity>
        </ScrollView>
     </View>
   );

   const renderGoals = () => (
     <View style={styles.fullScreenSectionContainer}>
        <TouchableOpacity onPress={() => setSelectedSection(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={30} color="#5A2E18" />
        </TouchableOpacity>
        <Text style={styles.sectionHeader}>Group Goals</Text>
        <ScrollView>
          {goals.map((goal) => (
            <View key={goal.id} style={styles.rowContainer}>
              <TouchableOpacity onPress={() => toggleGoalDone(goal.id)}>
                <Ionicons name={goal.done ? "checkbox" : "square-outline"} size={28} color="#5A2E18" />
              </TouchableOpacity>
              <TextInput style={[styles.largeInput, { textDecorationLine: goal.done ? 'line-through' : 'none', marginLeft: 10 }]} placeholder="Group Goal" value={goal.item} onChangeText={(val) => handleInputChange('goals', goal.id, val)} />
              <TouchableOpacity onPress={() => handleRemoveRow('goals', goal.id)}>
                <Ionicons name="remove-circle-outline" size={28} color="#A52A2A" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddRow('goals')}>
            <Ionicons name="add-circle" size={30} color="#5A2E18" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </ScrollView>
     </View>
   );

   const renderReports = () => {
     const totalEvents = events.length;
     const totalTrips = trips.length;
     const totalEventSpend = events.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
     const totalTripSpend = trips.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
     const accomplishedGoals = goals.filter(g => g.done).length;

     return (
        <View style={styles.fullScreenSectionContainer}>
            {/* UPDATED BACK BUTTON ONPRESS */}
            <TouchableOpacity onPress={() => setShowReports(false)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={30} color="#5A2E18" />
            </TouchableOpacity>
            <Text style={styles.sectionHeader}>Reports</Text>
            <ScrollView contentContainerStyle={{ padding: 10 }}>
                <View style={styles.reportCard}>
                    <Ionicons name="podium-outline" size={40} color="#5A2E18" style={{ alignSelf: 'center', marginBottom: 10 }}/>
                    <Text style={styles.reportTitle}>All-Time Summary</Text>
                    <Text style={styles.reportText}>Total Plans Made: {totalEvents + totalTrips}</Text>
                    <Text style={styles.reportText}>- Events: {totalEvents}</Text>
                    <Text style={styles.reportText}>- Trips: {totalTrips}</Text>
                    <Text style={styles.reportText}>Goals Accomplished: {accomplishedGoals} / {goals.length}</Text>
                    <Text style={styles.reportHighlight}>Total Estimated Spending: ${(totalEventSpend + totalTripSpend).toFixed(2)}</Text>
                </View>
            </ScrollView>
        </View>
     );
   };

  // --- Main Render ---
  return (
    <ImageBackground source={require('../assets/friendsbackg.jpg')} style={styles.background} resizeMode="cover">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.container}>
            {renderFriendsModal()}
            
            {/* UPDATED RENDER LOGIC */}
            {showReports ? (
              renderReports()
            ) : !selectedSection ? (
              <>
                <Text style={styles.welcomeText}>Friends Hub</Text>
                <Text style={styles.subtitle}>Plan, Share, and Remember</Text>

                {/* NEW REPORTS BUTTON */}
                <TouchableOpacity onPress={() => setShowReports(true)} style={styles.reportsButton}>
                  <Text style={styles.reportsLink}>View Reports</Text>
                </TouchableOpacity>
                
                <View style={styles.sectionsContainer}>
                  <TouchableOpacity style={styles.sectionCard} onPress={() => setModalVisible(true)}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/friendss.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Manage Friends</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('events')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/party.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Events/Parties</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('trips')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/trips.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Trips/Travel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('memories')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/memoriess.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Memories</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sectionCard} onPress={() => setSelectedSection('goals')}>
                    <View style={styles.sectionImageWrapper}><Image source={require('../assets/friendsgoals.jpg')} style={styles.sectionImage} /></View>
                    <Text style={styles.sectionText}>Group Goals</Text>
                  </TouchableOpacity>
                  {/* Reports card is removed from here */}
                </View>
              </>
            ) : (
                <>
                  {selectedSection === 'events' && renderPlans('events', events)}
                  {selectedSection === 'trips' && renderPlans('trips', trips)}
                  {selectedSection === 'memories' && renderMemories()}
                  {selectedSection === 'goals' && renderGoals()}
                </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
    </ImageBackground>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#A9998A' },
  container: { flexGrow: 1, padding: 25, alignItems: 'center' },
  welcomeText: { fontSize: 36, fontWeight: 'bold', color: '#3A3A3A', marginTop: 40, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 2 },
  subtitle: { fontSize: 18, color: '#5A2E18', marginBottom: 20, textAlign: 'center' },
  
  sectionsContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  sectionCard: {
    width: '46%',
    backgroundColor: 'rgba(211, 201, 191, 0.85)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  sectionImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#EAE3DC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionImage: {
    width: '90%',
    height: '90%',
    borderRadius: 35,
  },
  sectionText: { fontSize: 16, fontWeight: '600', color: '#3A3A3A', textAlign: 'center' },

  fullScreenSectionContainer: { flex: 1, width: '100%', backgroundColor: 'transparent', padding: 15 },
  backButton: { position: 'absolute', top: 15, left: 15, zIndex: 10, backgroundColor: 'rgba(211, 201, 191, 0.8)', padding: 5, borderRadius: 20 },
  sectionHeader: { fontSize: 28, fontWeight: 'bold', color: '#3A3A3A', marginBottom: 20, textAlign: 'center', marginTop: 50 },
  
  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#D3C9BF', borderRadius: 20, padding: 20, elevation: 10 },
  modalCloseButton: { backgroundColor: '#5A2E18', borderRadius: 15, padding: 15, marginTop: 20 },
  modalCloseButtonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },

  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  largeInput: { flex: 1, backgroundColor: '#EAE3DC', borderRadius: 12, padding: 12, marginRight: 8, fontSize: 16, color: '#3A3A3A' },
  addButton: { alignSelf: 'center', marginTop: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDCB97', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, elevation: 2 },
  addButtonText: { color: '#3A3A3A', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  // Plan Styles
  planContainer: { backgroundColor: 'rgba(211, 201, 191, 0.9)', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 3 },
  planTitleInput: { fontSize: 18, fontWeight: 'bold', color: '#3A3A3A', borderBottomWidth: 1, borderColor: '#A9998A', paddingBottom: 8, marginBottom: 10 },
  planAmountInput: { backgroundColor: '#EAE3DC', borderRadius: 10, padding: 10, fontSize: 16, marginBottom: 5 },
  perHeadText: { fontSize: 15, color: '#5A2E18', fontStyle: 'italic', marginBottom: 15, textAlign: 'center' },
  rolesHeader: { fontSize: 16, fontWeight: '600', color: '#3A3A3A', marginBottom: 5 },
  rolesInput: { backgroundColor: '#EAE3DC', borderRadius: 10, padding: 10, fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  removePlanButton: { marginTop: 15, alignItems: 'center', padding: 8, backgroundColor: '#C8A0A0', borderRadius: 10 },
  removePlanText: { color: '#5A2E18', fontWeight: 'bold' },

  // Memories Styles
  memoryRowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'rgba(211, 201, 191, 0.9)', padding: 10, borderRadius: 15 },
  imagePickerContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  memoryImage: { width: '100%', height: '100%', borderRadius: 12 },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#EAE3DC', justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: '#5A2E18', borderStyle: 'dashed' },
  imagePlaceholderText: { color: '#5A2E18', fontSize: 12, textAlign: 'center' },
  memoryNoteInput: { flex: 1, backgroundColor: '#EAE3DC', borderRadius: 12, padding: 10, marginHorizontal: 8, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  
  // NEW STYLES FOR REPORTS BUTTON
  reportsButton: {
    backgroundColor: 'rgba(90, 46, 24, 0.8)', // Dark brown color from theme
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
    width: '90%',
    elevation: 3,
  },
  reportsLink: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },

  // Reports Styles
  reportCard: { backgroundColor: 'rgba(211, 201, 191, 0.95)', borderRadius: 15, padding: 20, elevation: 2 },
  reportTitle: { fontSize: 20, fontWeight: 'bold', color: '#3A3A3A', marginBottom: 15, textAlign: 'center' },
  reportText: { fontSize: 16, color: '#5A2E18', marginBottom: 8, lineHeight: 22 },
  reportHighlight: { fontSize: 17, fontWeight: 'bold', color: '#3A3A3A', marginTop: 15, textAlign: 'center', backgroundColor: '#DDCB97', padding: 10, borderRadius: 10 }
});

export default FriendsScreen;